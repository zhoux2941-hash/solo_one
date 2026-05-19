#include "Simulation/TetraMesh.h"
#include "Simulation/PBDSolver.h"
#include "Visualization/Renderer.h"
#include <GL/glut.h>
#include <iostream>
#include <string>
#include <chrono>
#include <sstream>

TetraMesh g_mesh;
PBDSolver g_solver;
Renderer g_renderer;
bool g_paused = false;
int g_meshResolution = 8;
bool g_showFPS = true;
std::chrono::high_resolution_clock::time_point g_lastFrameTime;
float g_fps = 0.0f;
int g_frameCount = 0;

void updateFPS() {
    g_frameCount++;
    auto now = std::chrono::high_resolution_clock::now();
    float dt = std::chrono::duration<float>(now - g_lastFrameTime).count();
    if (dt > 0.5f) {
        g_fps = g_frameCount / dt;
        g_frameCount = 0;
        g_lastFrameTime = now;
    }
}

void display() {
    updateFPS();
    g_renderer.render();

    if (g_showFPS) {
        glMatrixMode(GL_PROJECTION);
        glPushMatrix();
        glLoadIdentity();
        gluOrtho2D(0, glutGet(GLUT_WINDOW_WIDTH), 0, glutGet(GLUT_WINDOW_HEIGHT));
        glMatrixMode(GL_MODELVIEW);
        glPushMatrix();
        glLoadIdentity();

        glColor3f(1, 1, 1);
        int yPos = glutGet(GLUT_WINDOW_HEIGHT) - 20;
        std::ostringstream oss;
        oss.precision(1);
        oss << std::fixed;

        oss << "FPS: " << (int)g_fps;
        std::string fpsText = oss.str();
        glRasterPos2i(10, yPos);
        for (char c : fpsText) glutBitmapCharacter(GLUT_BITMAP_HELVETICA_12, c);

        yPos -= 20;
        oss.str("");
        oss << "Particles: " << g_mesh.particles.size() << " | Tetrahedra: " << g_mesh.tetrahedra.size();
        glRasterPos2i(10, yPos);
        for (char c : oss.str()) glutBitmapCharacter(GLUT_BITMAP_HELVETICA_12, c);

        yPos -= 20;
        oss.str("");
        oss << "Muscles: " << (g_solver.enableMuscles ? "ON" : "OFF") 
            << " | Pattern: " << g_solver.crawlingController.getPatternName();
        glRasterPos2i(10, yPos);
        for (char c : oss.str()) glutBitmapCharacter(GLUT_BITMAP_HELVETICA_12, c);

        yPos -= 20;
        oss.str("");
        oss << "Frequency: " << g_solver.muscleSystem.globalFrequency 
            << " | Amplitude: " << g_solver.muscleSystem.globalAmplitude;
        glRasterPos2i(10, yPos);
        for (char c : oss.str()) glutBitmapCharacter(GLUT_BITMAP_HELVETICA_12, c);

        yPos -= 30;
        glColor3f(0.8f, 0.8f, 0.2f);
        glRasterPos2i(10, yPos);
        std::string help = "M: Toggle Muscles | N: Next Pattern | ,.: Frequency | /?: Amplitude | 7/8: Resolution";
        for (char c : help) glutBitmapCharacter(GLUT_BITMAP_HELVETICA_10, c);

        glPopMatrix();
        glMatrixMode(GL_PROJECTION);
        glPopMatrix();
        glMatrixMode(GL_MODELVIEW);
    }

    glutSwapBuffers();
}

void idle() {
    if (!g_paused) {
        g_solver.step(0.016f);
    }
    glutPostRedisplay();
}

void setupMuscleSystem() {
    g_solver.muscleSystem.clear();

    int n = g_meshResolution;
    float halfSize = 0.5f;
    float step = 1.0f / (n - 1);

    auto getIdx = [n](int x, int y, int z) {
        return x + y * n + z * n * n;
    };

    const int numGroups = 5;
    for (int g = 0; g < numGroups; g++) {
        MuscleGroup group("Group" + std::to_string(g));

        int startZ = (n - 1) * g / numGroups;
        int endZ = (n - 1) * (g + 1) / numGroups;

        for (int z = startZ; z <= endZ && z < n; z++) {
            for (int y = 0; y < n; y++) {
                for (int x = 0; x < n - 1; x++) {
                    int i = getIdx(x, y, z);
                    int j = getIdx(x + 1, y, z);
                    group.addMuscle(MuscleConstraint(i, j, step, 150.0f, 0.25f));
                }
            }
        }

        g_solver.muscleSystem.addMuscleGroup(group);
    }

    std::cout << "Muscle system setup complete: " 
              << g_solver.muscleSystem.muscleGroups.size() << " groups" << std::endl;
}

void keyboard(unsigned char key, int x, int y) {
    switch (key) {
        case 27:
            exit(0);
            break;
        case ' ':
            g_paused = !g_paused;
            break;
        case 'w':
        case 'W':
            g_renderer.wireframe = !g_renderer.wireframe;
            break;
        case 's':
        case 'S':
            g_renderer.showStress = !g_renderer.showStress;
            break;
        case 'e':
        case 'E':
            g_renderer.showEdges = !g_renderer.showEdges;
            break;
        case 'p':
        case 'P':
            g_renderer.showParticles = !g_renderer.showParticles;
            break;
        case 'f':
        case 'F':
            g_showFPS = !g_showFPS;
            break;
        case 'b':
        case 'B':
            g_solver.enableBendingConstraints = !g_solver.enableBendingConstraints;
            std::cout << "Bending Constraints: " << (g_solver.enableBendingConstraints ? "ON" : "OFF") << std::endl;
            break;
        case '1':
            g_solver.iterations = std::max(1, g_solver.iterations - 1);
            std::cout << "Iterations: " << g_solver.iterations << std::endl;
            break;
        case '2':
            g_solver.iterations++;
            std::cout << "Iterations: " << g_solver.iterations << std::endl;
            break;
        case '3':
            g_mesh.youngsModulus *= 0.8f;
            std::cout << "Young's Modulus: " << g_mesh.youngsModulus << std::endl;
            break;
        case '4':
            g_mesh.youngsModulus *= 1.25f;
            std::cout << "Young's Modulus: " << g_mesh.youngsModulus << std::endl;
            break;
        case '5':
            g_solver.damping = std::max(0.8f, g_solver.damping - 0.05f);
            std::cout << "Damping: " << g_solver.damping << std::endl;
            break;
        case '6':
            g_solver.damping = std::min(0.999f, g_solver.damping + 0.05f);
            std::cout << "Damping: " << g_solver.damping << std::endl;
            break;
        case '7':
            g_meshResolution = std::max(4, g_meshResolution - 2);
            g_mesh.generateCube(1.0f, g_meshResolution);
            g_solver.setMesh(&g_mesh);
            setupMuscleSystem();
            std::cout << "Mesh Resolution: " << g_meshResolution << std::endl;
            break;
        case '8':
            g_meshResolution = std::min(12, g_meshResolution + 2);
            g_mesh.generateCube(1.0f, g_meshResolution);
            g_solver.setMesh(&g_mesh);
            setupMuscleSystem();
            std::cout << "Mesh Resolution: " << g_meshResolution << std::endl;
            break;
        case '9':
            g_solver.stressUpdateInterval = std::max(1, g_solver.stressUpdateInterval - 1);
            std::cout << "Stress Update Interval: " << g_solver.stressUpdateInterval << std::endl;
            break;
        case '0':
            g_solver.stressUpdateInterval++;
            std::cout << "Stress Update Interval: " << g_solver.stressUpdateInterval << std::endl;
            break;
        case 'm':
        case 'M':
            g_solver.enableMuscles = !g_solver.enableMuscles;
            std::cout << "Muscle System: " << (g_solver.enableMuscles ? "ON" : "OFF") << std::endl;
            break;
        case 'n':
        case 'N': {
            int pattern = static_cast<int>(g_solver.crawlingController.currentPattern);
            pattern = (pattern + 1) % 4;
            g_solver.crawlingController.currentPattern = static_cast<CrawlingController::Pattern>(pattern);
            std::cout << "Pattern: " << g_solver.crawlingController.getPatternName() << std::endl;
            break;
        }
        case ',':
        case '<':
            g_solver.muscleSystem.globalFrequency = std::max(0.1f, g_solver.muscleSystem.globalFrequency - 0.2f);
            std::cout << "Muscle Frequency: " << g_solver.muscleSystem.globalFrequency << std::endl;
            break;
        case '.':
        case '>':
            g_solver.muscleSystem.globalFrequency = std::min(5.0f, g_solver.muscleSystem.globalFrequency + 0.2f);
            std::cout << "Muscle Frequency: " << g_solver.muscleSystem.globalFrequency << std::endl;
            break;
        case '/':
        case '?':
            g_solver.muscleSystem.globalAmplitude = std::max(0.0f, g_solver.muscleSystem.globalAmplitude - 0.1f);
            std::cout << "Muscle Amplitude: " << g_solver.muscleSystem.globalAmplitude << std::endl;
            break;
        case '\'':
        case '"':
            g_solver.muscleSystem.globalAmplitude = std::min(2.0f, g_solver.muscleSystem.globalAmplitude + 0.1f);
            std::cout << "Muscle Amplitude: " << g_solver.muscleSystem.globalAmplitude << std::endl;
            break;
        case 'k':
        case 'K':
            g_renderer.showMuscles = !g_renderer.showMuscles;
            break;
    }
}

void mouse(int button, int state, int x, int y) {
    if (state == GLUT_DOWN) {
        if (button == 3 || button == 4) {
            g_renderer.handleMouseWheel(button, (button == 3) ? 1 : -1, x, y);
        }
    }
}

void motion(int x, int y) {
    static int lastX = x, lastY = y;

    if (glutGetModifiers() & GLUT_ACTIVE_SHIFT) {
        g_renderer.cameraAngleY += (x - lastX) * 0.5f;
        g_renderer.cameraAngleX += (y - lastY) * 0.5f;
        g_renderer.cameraAngleX = std::max(-89.0f, std::min(89.0f, g_renderer.cameraAngleX));
    }

    lastX = x;
    lastY = y;
}

void reshape(int width, int height) {
    glViewport(0, 0, width, height);
    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    gluPerspective(45.0f, (float)width / height, 0.1f, 100.0f);
    glMatrixMode(GL_MODELVIEW);
}

void printHelp() {
    std::cout << "======= PBD Soft Robot Simulation ======" << std::endl;
    std::cout << "Space    - Pause/Resume simulation" << std::endl;
    std::cout << "W        - Toggle wireframe mode" << std::endl;
    std::cout << "S        - Toggle stress visualization" << std::endl;
    std::cout << "E        - Toggle edge rendering" << std::endl;
    std::cout << "P        - Toggle particle rendering" << std::endl;
    std::cout << "F        - Toggle FPS counter" << std::endl;
    std::cout << "B        - Toggle bending constraints" << std::endl;
    std::cout << "1/2      - Decrease/Increase solver iterations" << std::endl;
    std::cout << "3/4      - Decrease/Increase stiffness" << std::endl;
    std::cout << "5/6      - Decrease/Increase damping" << std::endl;
    std::cout << "7/8      - Decrease/Increase mesh resolution" << std::endl;
    std::cout << "9/0      - Decrease/Increase stress update interval" << std::endl;
    std::cout << "------- Muscle Controls -------" << std::endl;
    std::cout << "M        - Toggle muscle system ON/OFF" << std::endl;
    std::cout << "N        - Next crawling pattern" << std::endl;
    std::cout << ",/.      - Decrease/Increase contraction frequency" << std::endl;
    std::cout << "/'       - Decrease/Increase contraction amplitude" << std::endl;
    std::cout << "K        - Toggle muscle visualization" << std::endl;
    std::cout << "Shift+Mouse - Rotate camera" << std::endl;
    std::cout << "Mouse wheel - Zoom in/out" << std::endl;
    std::cout << "ESC      - Exit" << std::endl;
    std::cout << "========================================" << std::endl;
}

int main(int argc, char** argv) {
    glutInit(&argc, argv);
    glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGB | GLUT_DEPTH);
    glutInitWindowSize(1024, 768);
    glutCreateWindow("PBD Soft Robot - Muscle Simulation");

    glEnable(GL_DEPTH_TEST);
    glEnable(GL_COLOR_MATERIAL);
    glShadeModel(GL_SMOOTH);

    g_mesh.generateCube(1.0f, g_meshResolution);
    g_mesh.youngsModulus = 400.0f;

    g_solver.setMesh(&g_mesh);
    g_solver.iterations = 12;
    g_solver.damping = 0.97f;
    g_solver.gravity = Vec3(0.0f, -4.0f, 0.0f);
    g_solver.stressUpdateInterval = 2;

    g_solver.collisionSystem.addPlane(Vec3(0, 1, 0), -0.6f);

    setupMuscleSystem();

    g_renderer.mesh = &g_mesh;
    g_renderer.solver = &g_solver;
    g_renderer.rigidBodies = &g_solver.rigidBodies;
    g_renderer.stressMax = 150.0f;
    g_renderer.cameraDistance = 6.0f;
    g_renderer.cameraAngleX = 20.0f;

    g_lastFrameTime = std::chrono::high_resolution_clock::now();

    printHelp();

    glutDisplayFunc(display);
    glutIdleFunc(idle);
    glutKeyboardFunc(keyboard);
    glutMouseFunc(mouse);
    glutMotionFunc(motion);
    glutReshapeFunc(reshape);

    glutMainLoop();

    return 0;
}
